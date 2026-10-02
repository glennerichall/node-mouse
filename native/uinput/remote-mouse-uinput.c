#include <errno.h>
#include <fcntl.h>
#include <linux/input-event-codes.h>
#include <linux/uinput.h>
#include <node_api.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>
#include <sys/ioctl.h>
#include <unistd.h>

static int device_fd = -1;
static double pointer_x_remainder, pointer_y_remainder;
static double scroll_x_remainder, scroll_y_remainder;

static void close_device(void *data) {
    (void)data;
    if (device_fd < 0) return;
    ioctl(device_fd, UI_DEV_DESTROY);
    close(device_fd);
    device_fd = -1;
}

static napi_value undefined_value(napi_env env) {
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

static napi_value throw_errno(napi_env env, const char *prefix) {
    char message[256];
    snprintf(message, sizeof(message), "%s: %s", prefix, strerror(errno));
    napi_throw_error(env, errno == EACCES ? "UINPUT_PERMISSION_DENIED" : "UINPUT_ERROR", message);
    return NULL;
}

static bool require_open(napi_env env) {
    if (device_fd >= 0) return true;
    napi_throw_error(env, "UINPUT_NOT_OPEN", "The uinput bridge is not open");
    return false;
}

static bool emit_event(unsigned short type, unsigned short code, int value) {
    struct input_event event = {0};
    event.type = type;
    event.code = code;
    event.value = value;
    return write(device_fd, &event, sizeof(event)) == (ssize_t)sizeof(event);
}

static napi_value sync_events(napi_env env) {
    return emit_event(EV_SYN, SYN_REPORT, 0)
        ? undefined_value(env)
        : throw_errno(env, "Cannot write to /dev/uinput");
}

static int enable_keys(int fd) {
    for (int code = 0; code <= KEY_MAX; code++) {
        if (ioctl(fd, UI_SET_KEYBIT, code) < 0) return -1;
    }
    return 0;
}

static napi_value open_bridge(napi_env env, napi_callback_info info) {
    (void)info;
    if (device_fd >= 0) return undefined_value(env);
    device_fd = open("/dev/uinput", O_WRONLY | O_NONBLOCK);
    if (device_fd < 0) return throw_errno(env, "Cannot open /dev/uinput");

    if (ioctl(device_fd, UI_SET_EVBIT, EV_KEY) < 0 ||
        ioctl(device_fd, UI_SET_EVBIT, EV_REL) < 0 ||
        ioctl(device_fd, UI_SET_RELBIT, REL_X) < 0 ||
        ioctl(device_fd, UI_SET_RELBIT, REL_Y) < 0 ||
        ioctl(device_fd, UI_SET_RELBIT, REL_WHEEL) < 0 ||
        ioctl(device_fd, UI_SET_RELBIT, REL_HWHEEL) < 0 || enable_keys(device_fd) < 0) {
        napi_value error = throw_errno(env, "Cannot configure /dev/uinput");
        close_device(NULL);
        return error;
    }

    struct uinput_setup setup = {0};
    setup.id.bustype = BUS_VIRTUAL;
    setup.id.vendor = 0x524d;
    setup.id.product = 1;
    setup.id.version = 1;
    snprintf(setup.name, UINPUT_MAX_NAME_SIZE, "Remote Mouse Virtual Input");
    if (ioctl(device_fd, UI_DEV_SETUP, &setup) < 0 || ioctl(device_fd, UI_DEV_CREATE) < 0) {
        napi_value error = throw_errno(env, "Cannot create uinput device");
        close_device(NULL);
        return error;
    }
    return undefined_value(env);
}

static bool read_pair(napi_env env, napi_callback_info info, double *first, double *second) {
    size_t argc = 2;
    napi_value argv[2];
    if (napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok || argc != 2 ||
        napi_get_value_double(env, argv[0], first) != napi_ok ||
        napi_get_value_double(env, argv[1], second) != napi_ok) {
        napi_throw_type_error(env, "UINPUT_INVALID_ARGUMENT", "Expected two numeric arguments");
        return false;
    }
    return true;
}

static napi_value move_relative(napi_env env, napi_callback_info info) {
    double x, y;
    if (!require_open(env) || !read_pair(env, info, &x, &y)) return NULL;
    pointer_x_remainder += x;
    pointer_y_remainder += y;
    int delta_x = (int)pointer_x_remainder;
    int delta_y = (int)pointer_y_remainder;
    pointer_x_remainder -= delta_x;
    pointer_y_remainder -= delta_y;
    if (!emit_event(EV_REL, REL_X, delta_x) || !emit_event(EV_REL, REL_Y, delta_y)) {
        return throw_errno(env, "Cannot move uinput pointer");
    }
    return sync_events(env);
}

static napi_value scroll_pointer(napi_env env, napi_callback_info info) {
    double x, y;
    if (!require_open(env) || !read_pair(env, info, &x, &y)) return NULL;
    scroll_x_remainder += x;
    scroll_y_remainder += y;
    int delta_x = (int)scroll_x_remainder;
    int delta_y = (int)scroll_y_remainder;
    scroll_x_remainder -= delta_x;
    scroll_y_remainder -= delta_y;
    if (!emit_event(EV_REL, REL_HWHEEL, delta_x) || !emit_event(EV_REL, REL_WHEEL, delta_y)) {
        return throw_errno(env, "Cannot scroll uinput pointer");
    }
    return sync_events(env);
}

static napi_value emit_key(napi_env env, napi_callback_info info) {
    double code_value, pressed_value;
    if (!require_open(env) || !read_pair(env, info, &code_value, &pressed_value)) return NULL;
    int code = (int)code_value;
    if (code < 0 || code > KEY_MAX) {
        napi_throw_range_error(env, "UINPUT_INVALID_KEY", "Key code is outside the Linux input range");
        return NULL;
    }
    if (!emit_event(EV_KEY, (unsigned short)code, pressed_value != 0 ? 1 : 0)) {
        return throw_errno(env, "Cannot write uinput key");
    }
    return sync_events(env);
}

static napi_value close_bridge(napi_env env, napi_callback_info info) {
    (void)info;
    close_device(NULL);
    return undefined_value(env);
}

static napi_value initialize(napi_env env, napi_value exports) {
    napi_property_descriptor properties[] = {
        {"open", NULL, open_bridge, NULL, NULL, NULL, napi_default, NULL},
        {"moveRelative", NULL, move_relative, NULL, NULL, NULL, napi_default, NULL},
        {"scroll", NULL, scroll_pointer, NULL, NULL, NULL, napi_default, NULL},
        {"button", NULL, emit_key, NULL, NULL, NULL, napi_default, NULL},
        {"key", NULL, emit_key, NULL, NULL, NULL, napi_default, NULL},
        {"close", NULL, close_bridge, NULL, NULL, NULL, napi_default, NULL},
    };
    napi_define_properties(env, exports, sizeof(properties) / sizeof(properties[0]), properties);
    napi_add_env_cleanup_hook(env, close_device, NULL);
    return exports;
}

NAPI_MODULE(remote_mouse_uinput, initialize)
