package com.smartbite.scale;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.os.ParcelUuid;
import android.provider.Settings;

import androidx.activity.result.ActivityResult;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

@CapacitorPlugin(
    name = "BluetoothClassic",
    permissions = {
        @Permission(alias = "scan", strings = {Manifest.permission.BLUETOOTH_SCAN}),
        @Permission(alias = "connect", strings = {Manifest.permission.BLUETOOTH_CONNECT}),
        @Permission(alias = "location", strings = {Manifest.permission.ACCESS_FINE_LOCATION})
    }
)
public class BluetoothClassicPlugin extends Plugin {
    private static final UUID SERIAL_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private static final String PREFS_NAME = "smartbite_bluetooth_classic";
    private static final String PREF_KEY_PERMISSIONS_REQUESTED = "permissions_requested";

    private final Object socketLock = new Object();
    private final Map<String, JSObject> discoveredDevices = new LinkedHashMap<>();
    private final ExecutorService ioExecutor = Executors.newSingleThreadExecutor();

    private BluetoothAdapter bluetoothAdapter;
    private BroadcastReceiver discoveryReceiver;
    private boolean discoveryReceiverRegistered = false;
    private BluetoothSocket bluetoothSocket;
    private BluetoothDevice connectedDevice;
    private BufferedReader reader;
    private BufferedWriter writer;
    private Future<?> readerFuture;

    @Override
    public void load() {
        BluetoothManager bluetoothManager = getContext().getSystemService(BluetoothManager.class);
        bluetoothAdapter = bluetoothManager != null
            ? bluetoothManager.getAdapter()
            : BluetoothAdapter.getDefaultAdapter();
        ensureDiscoveryReceiver();
    }

    @Override
    protected void handleOnDestroy() {
        disconnectInternal("Plugin destroyed.", false);
        unregisterDiscoveryReceiver();
        ioExecutor.shutdownNow();
        super.handleOnDestroy();
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(buildStatusPayload());
    }

    @PluginMethod
    public void requestBluetoothPermissions(PluginCall call) {
        if (!isSupported()) {
            call.unavailable("Bluetooth Classic is not supported on this device.");
            return;
        }

        if (hasBluetoothPermissions()) {
            call.resolve(buildStatusPayload());
            return;
        }

        markPermissionsRequested();
        requestPermissionForAliases(getRequiredPermissionAliases(), call, "permissionsCallback");
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        if (!hasBluetoothPermissions()) {
            call.reject("Bluetooth permissions were denied.", "PERMISSION_DENIED");
            return;
        }

        call.resolve(buildStatusPayload());
    }

    @PluginMethod
    public void requestEnable(PluginCall call) {
        if (!isSupported()) {
            call.unavailable("Bluetooth Classic is not supported on this device.");
            return;
        }

        if (safeIsBluetoothEnabled()) {
            JSObject payload = new JSObject();
            payload.put("enabled", true);
            call.resolve(payload);
            return;
        }

        if (!hasConnectPermissionForAdapterAction()) {
            call.reject("Bluetooth connect permission is required before enabling Bluetooth.", "PERMISSION_DENIED");
            return;
        }

        Intent intent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
        startActivityForResult(call, intent, "requestEnableCallback");
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        Intent intent = new Intent(
            Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.fromParts("package", getContext().getPackageName(), null)
        );
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);

        JSObject payload = new JSObject();
        payload.put("opened", true);
        call.resolve(payload);
    }

    @ActivityCallback
    private void requestEnableCallback(PluginCall call, ActivityResult result) {
        JSObject payload = new JSObject();
        payload.put("enabled", safeIsBluetoothEnabled());
        if (result.getResultCode() == Activity.RESULT_OK || Boolean.TRUE.equals(payload.getBool("enabled"))) {
            call.resolve(payload);
            return;
        }

        call.reject("Bluetooth must be enabled to connect to the scale.", "BLUETOOTH_DISABLED", null, payload);
    }

    @PluginMethod
    public void getPairedDevices(PluginCall call) {
        if (!isSupported()) {
            call.unavailable("Bluetooth Classic is not supported on this device.");
            return;
        }

        if (!hasBluetoothPermissions()) {
            call.reject("Bluetooth permissions are required before scanning.", "PERMISSION_DENIED");
            return;
        }

        JSArray devices = new JSArray();
        if (bluetoothAdapter != null) {
            Set<BluetoothDevice> bondedDevices = bluetoothAdapter.getBondedDevices();
            for (BluetoothDevice device : bondedDevices) {
                devices.put(toDevicePayload(device, null));
            }
        }

        JSObject payload = new JSObject();
        payload.put("devices", devices);
        call.resolve(payload);
    }

    @PluginMethod
    public void startDiscovery(PluginCall call) {
        if (!isSupported()) {
            call.unavailable("Bluetooth Classic is not supported on this device.");
            return;
        }

        if (!hasBluetoothPermissions()) {
            call.reject("Bluetooth permissions are required before scanning.", "PERMISSION_DENIED");
            return;
        }

        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth must be enabled before scanning.", "BLUETOOTH_DISABLED");
            return;
        }

        ensureDiscoveryReceiver();
        discoveredDevices.clear();

        if (bluetoothAdapter.isDiscovering()) {
            bluetoothAdapter.cancelDiscovery();
        }

        boolean started = bluetoothAdapter.startDiscovery();
        if (!started) {
            call.reject("Unable to start Bluetooth discovery.", "DISCOVERY_FAILED");
            return;
        }

        notifyDiscoveryState(true);
        JSObject payload = new JSObject();
        payload.put("started", true);
        call.resolve(payload);
    }

    @PluginMethod
    public void stopDiscovery(PluginCall call) {
        boolean stopped = stopDiscoveryInternal();
        JSObject payload = new JSObject();
        payload.put("stopped", stopped);
        call.resolve(payload);
    }

    @PluginMethod
    public void connect(PluginCall call) {
        if (!isSupported()) {
            call.unavailable("Bluetooth Classic is not supported on this device.");
            return;
        }

        if (!hasBluetoothPermissions()) {
            call.reject("Bluetooth permissions are required before connecting.", "PERMISSION_DENIED");
            return;
        }

        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth must be enabled before connecting.", "BLUETOOTH_DISABLED");
            return;
        }

        String address = call.getString("address");
        if (address == null || address.trim().isEmpty()) {
            call.reject("A Bluetooth device address is required.", "INVALID_ADDRESS");
            return;
        }

        BluetoothDevice device;
        try {
            device = bluetoothAdapter.getRemoteDevice(address.trim());
        } catch (IllegalArgumentException error) {
            call.reject("The selected Bluetooth address is invalid.", "INVALID_ADDRESS", error);
            return;
        }

        stopDiscoveryInternal();
        notifyConnectionState("connecting", "Connecting to " + safeDeviceName(device) + ".", device);

        getBridge().execute(() -> {
            try {
                BluetoothSocket socket = connectSocket(device);
                disconnectInternal("Replacing existing Bluetooth connection.", false);
                synchronized (socketLock) {
                    bluetoothSocket = socket;
                    connectedDevice = device;
                    reader = new BufferedReader(
                        new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8)
                    );
                    writer = new BufferedWriter(
                        new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8)
                    );
                }

                startReaderLoop();

                JSObject payload = new JSObject();
                payload.put("device", toDevicePayload(device, null));
                call.resolve(payload);
                notifyConnectionState("connected", "Connected to " + safeDeviceName(device) + ".", device);
            } catch (Exception error) {
                disconnectInternal("Connection failed.", false);
                notifyConnectionState("error", error.getMessage(), device);
                call.reject(
                    error.getMessage() != null ? error.getMessage() : "Bluetooth connection failed.",
                    "CONNECTION_FAILED",
                    error
                );
            }
        });
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        disconnectInternal("Disconnected.", true);
        JSObject payload = new JSObject();
        payload.put("disconnected", true);
        call.resolve(payload);
    }

    @PluginMethod
    public void send(PluginCall call) {
        String value = call.getString("value");
        if (value == null || value.trim().isEmpty()) {
            call.reject("A command value is required.", "INVALID_COMMAND");
            return;
        }

        BufferedWriter activeWriter;
        synchronized (socketLock) {
            activeWriter = writer;
        }

        if (activeWriter == null) {
            call.reject("No Bluetooth scale is connected.", "NOT_CONNECTED");
            return;
        }

        getBridge().execute(() -> {
            try {
                synchronized (socketLock) {
                    if (writer == null) {
                        throw new IOException("No Bluetooth scale is connected.");
                    }

                    writer.write(value.trim());
                    writer.write("\n");
                    writer.flush();
                }

                JSObject payload = new JSObject();
                payload.put("sent", true);
                call.resolve(payload);
            } catch (IOException error) {
                disconnectInternal("Bluetooth write failed.", true);
                call.reject("Failed to send command to the scale.", "WRITE_FAILED", error);
            }
        });
    }

    private void startReaderLoop() {
        Future<?> existingReader = readerFuture;
        if (existingReader != null) {
            existingReader.cancel(true);
        }

        readerFuture = ioExecutor.submit(() -> {
            try {
                while (!Thread.currentThread().isInterrupted()) {
                    BufferedReader activeReader;
                    synchronized (socketLock) {
                        activeReader = reader;
                    }

                    if (activeReader == null) {
                        return;
                    }

                    String line = activeReader.readLine();
                    if (line == null) {
                        disconnectInternal("Bluetooth connection closed.", true);
                        return;
                    }

                    JSObject payload = new JSObject();
                    payload.put("line", line);
                    notifyListeners("serialMessage", payload);
                }
            } catch (IOException error) {
                disconnectInternal("Bluetooth connection lost.", true);
                notifyConnectionState("error", error.getMessage(), connectedDevice);
            }
        });
    }

    @SuppressLint("MissingPermission")
    private BluetoothSocket connectSocket(BluetoothDevice device) throws Exception {
        IOException firstFailure = null;

        BluetoothSocket secureSocket = null;
        try {
            secureSocket = device.createRfcommSocketToServiceRecord(SERIAL_UUID);
            secureSocket.connect();
            return secureSocket;
        } catch (IOException error) {
            firstFailure = error;
            closeSocketQuietly(secureSocket);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.GINGERBREAD_MR1) {
            BluetoothSocket insecureSocket = null;
            try {
                insecureSocket = device.createInsecureRfcommSocketToServiceRecord(SERIAL_UUID);
                insecureSocket.connect();
                return insecureSocket;
            } catch (IOException error) {
                if (firstFailure == null) {
                    firstFailure = error;
                }
                closeSocketQuietly(insecureSocket);
            }
        }

        try {
            Method method = device.getClass().getMethod("createRfcommSocket", int.class);
            BluetoothSocket fallbackSocket = (BluetoothSocket) method.invoke(device, 1);
            fallbackSocket.connect();
            return fallbackSocket;
        } catch (Exception error) {
            if (firstFailure != null) {
                throw new IOException(firstFailure.getMessage(), error);
            }
            throw error;
        }
    }

    private void ensureDiscoveryReceiver() {
        if (discoveryReceiver != null) {
            return;
        }

        discoveryReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                if (BluetoothDevice.ACTION_FOUND.equals(action)) {
                    BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                    if (device == null) {
                        return;
                    }

                    short rssi = intent.getShortExtra(BluetoothDevice.EXTRA_RSSI, Short.MIN_VALUE);
                    JSObject payload = toDevicePayload(
                        device,
                        rssi == Short.MIN_VALUE ? null : (int) rssi
                    );
                    discoveredDevices.put(device.getAddress(), payload);

                    JSObject event = new JSObject();
                    event.put("device", payload);
                    notifyListeners("deviceFound", event);
                    return;
                }

                if (BluetoothAdapter.ACTION_DISCOVERY_FINISHED.equals(action)) {
                    notifyDiscoveryState(false);
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction(BluetoothDevice.ACTION_FOUND);
        filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);

        ContextCompat.registerReceiver(
            getContext(),
            discoveryReceiver,
            filter,
            ContextCompat.RECEIVER_NOT_EXPORTED
        );
        discoveryReceiverRegistered = true;
    }

    private void unregisterDiscoveryReceiver() {
        if (!discoveryReceiverRegistered || discoveryReceiver == null) {
            return;
        }

        try {
            getContext().unregisterReceiver(discoveryReceiver);
        } catch (IllegalArgumentException ignored) {
            // Receiver was already unregistered.
        } finally {
            discoveryReceiverRegistered = false;
        }
    }

    private boolean stopDiscoveryInternal() {
        if (!safeIsDiscovering()) {
            notifyDiscoveryState(false);
            return false;
        }

        boolean stopped = bluetoothAdapter.cancelDiscovery();
        notifyDiscoveryState(false);
        return stopped;
    }

    private void notifyDiscoveryState(boolean isDiscovering) {
        JSObject payload = new JSObject();
        payload.put("isDiscovering", isDiscovering);
        notifyListeners("discoveryStateChanged", payload);
    }

    private void notifyConnectionState(String status, String message, BluetoothDevice device) {
        JSObject payload = new JSObject();
        payload.put("status", status);
        payload.put("message", message);
        if (device != null) {
            payload.put("device", toDevicePayload(device, null));
        }
        notifyListeners("connectionStateChanged", payload);
    }

    private JSObject buildStatusPayload() {
        JSObject payload = new JSObject();
        payload.put("supported", isSupported());
        payload.put("enabled", safeIsBluetoothEnabled());
        payload.put("discovering", safeIsDiscovering());
        payload.put("connected", connectedDevice != null && bluetoothSocket != null && bluetoothSocket.isConnected());
        payload.put("permissions", buildPermissionPayload());
        payload.put("permissionBlocked", isPermissionBlocked());
        if (connectedDevice != null && hasConnectPermissionForDeviceAccess()) {
            payload.put("device", toDevicePayload(connectedDevice, null));
        }
        return payload;
    }

    private JSObject buildPermissionPayload() {
        JSObject payload = new JSObject();
        payload.put("scan", permissionStateForAlias("scan"));
        payload.put("connect", permissionStateForAlias("connect"));
        payload.put("location", permissionStateForAlias("location"));
        return payload;
    }

    private String permissionStateForAlias(String alias) {
        return getPermissionState(alias).toString().toLowerCase();
    }

    private String[] getRequiredPermissionAliases() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return new String[]{"scan", "connect"};
        }

        return new String[]{"location"};
    }

    private boolean hasBluetoothPermissions() {
        for (String alias : getRequiredPermissionAliases()) {
            if (getPermissionState(alias) != PermissionState.GRANTED) {
                return false;
            }
        }

        return true;
    }

    private boolean hasConnectPermissionForAdapterAction() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S
            || getPermissionState("connect") == PermissionState.GRANTED;
    }

    private boolean hasConnectPermissionForDeviceAccess() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S
            || getPermissionState("connect") == PermissionState.GRANTED;
    }

    private boolean hasScanPermissionForAdapterState() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S
            || getPermissionState("scan") == PermissionState.GRANTED;
    }

    private void markPermissionsRequested() {
        getContext()
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(PREF_KEY_PERMISSIONS_REQUESTED, true)
            .apply();
    }

    private boolean hasRequestedPermissions() {
        return getContext()
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getBoolean(PREF_KEY_PERMISSIONS_REQUESTED, false);
    }

    private boolean isPermissionBlocked() {
        Activity activity = getActivity();
        if (activity == null || !hasRequestedPermissions()) {
            return false;
        }

        for (String alias : getRequiredPermissionAliases()) {
            if (getPermissionState(alias) == PermissionState.GRANTED) {
                continue;
            }

            String permission = permissionForAlias(alias);
            if (permission == null) {
                continue;
            }

            if (!ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)) {
                return true;
            }
        }

        return false;
    }

    private String permissionForAlias(String alias) {
        switch (alias) {
            case "scan":
                return Manifest.permission.BLUETOOTH_SCAN;
            case "connect":
                return Manifest.permission.BLUETOOTH_CONNECT;
            case "location":
                return Manifest.permission.ACCESS_FINE_LOCATION;
            default:
                return null;
        }
    }

    private boolean isSupported() {
        return bluetoothAdapter != null;
    }

    private boolean safeIsBluetoothEnabled() {
        if (bluetoothAdapter == null) {
            return false;
        }

        try {
            return bluetoothAdapter.isEnabled();
        } catch (SecurityException ignored) {
            return false;
        }
    }

    private boolean safeIsDiscovering() {
        if (bluetoothAdapter == null || !hasScanPermissionForAdapterState()) {
            return false;
        }

        try {
            return bluetoothAdapter.isDiscovering();
        } catch (SecurityException ignored) {
            return false;
        }
    }

    @SuppressLint("MissingPermission")
    private JSObject toDevicePayload(BluetoothDevice device, Integer rssi) {
        JSObject payload = new JSObject();
        payload.put("address", device.getAddress());
        payload.put("name", safeDeviceName(device));
        payload.put("rssi", rssi);
        payload.put("isPaired", device.getBondState() == BluetoothDevice.BOND_BONDED);
        payload.put("isHc06", safeDeviceName(device).toUpperCase().contains("HC-06"));

        ParcelUuid[] uuids = device.getUuids();
        payload.put("supportsSerialUuid", hasSerialUuid(uuids));
        return payload;
    }

    private boolean hasSerialUuid(ParcelUuid[] uuids) {
        if (uuids == null) {
            return false;
        }

        for (ParcelUuid uuid : uuids) {
            if (SERIAL_UUID.equals(uuid.getUuid())) {
                return true;
            }
        }

        return false;
    }

    private String safeDeviceName(BluetoothDevice device) {
        String name = device.getName();
        return name != null && !name.trim().isEmpty() ? name.trim() : device.getAddress();
    }

    private void disconnectInternal(String message, boolean emitEvent) {
        BluetoothDevice previousDevice;
        synchronized (socketLock) {
            previousDevice = connectedDevice;

            Future<?> existingReader = readerFuture;
            readerFuture = null;
            if (existingReader != null) {
                existingReader.cancel(true);
            }

            closeReaderQuietly(reader);
            closeWriterQuietly(writer);
            closeSocketQuietly(bluetoothSocket);

            reader = null;
            writer = null;
            bluetoothSocket = null;
            connectedDevice = null;
        }

        if (emitEvent && previousDevice != null) {
            notifyConnectionState("disconnected", message, previousDevice);
        }
    }

    private void closeReaderQuietly(BufferedReader bufferedReader) {
        if (bufferedReader == null) {
            return;
        }

        try {
            bufferedReader.close();
        } catch (IOException ignored) {
            // Ignore close failures.
        }
    }

    private void closeWriterQuietly(BufferedWriter bufferedWriter) {
        if (bufferedWriter == null) {
            return;
        }

        try {
            bufferedWriter.close();
        } catch (IOException ignored) {
            // Ignore close failures.
        }
    }

    private void closeSocketQuietly(BluetoothSocket socket) {
        if (socket == null) {
            return;
        }

        try {
            socket.close();
        } catch (IOException ignored) {
            // Ignore close failures.
        }
    }
}
