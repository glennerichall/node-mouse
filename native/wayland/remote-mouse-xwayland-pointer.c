#include <dlfcn.h>
#include <node_api.h>

typedef struct _XDisplay Display;
typedef unsigned long Window;

static void *x11_library = NULL;
static Display *display = NULL;
static Display *(*x_open_display)(const char *) = NULL;
static Window (*x_default_root_window)(Display *) = NULL;
static int (*x_query_pointer)(Display *, Window, Window *, Window *, int *, int *, int *, int *, unsigned int *) = NULL;
static int (*x_close_display)(Display *) = NULL;

static void close_display(void *data) {
    (void)data;
    if (display != NULL) {
        x_close_display(display);
        display = NULL;
    }
    if (x11_library != NULL) {
        dlclose(x11_library);
        x11_library = NULL;
    }
}

static napi_value null_value(napi_env env) {
    napi_value result;
    napi_get_null(env, &result);
    return result;
}

static napi_value get_position(napi_env env, napi_callback_info info) {
    (void)info;
    if (x11_library == NULL) {
        x11_library = dlopen("libX11.so.6", RTLD_LAZY | RTLD_LOCAL);
        if (x11_library == NULL) return null_value(env);
        *(void **)(&x_open_display) = dlsym(x11_library, "XOpenDisplay");
        *(void **)(&x_default_root_window) = dlsym(x11_library, "XDefaultRootWindow");
        *(void **)(&x_query_pointer) = dlsym(x11_library, "XQueryPointer");
        *(void **)(&x_close_display) = dlsym(x11_library, "XCloseDisplay");
        if (x_open_display == NULL || x_default_root_window == NULL ||
            x_query_pointer == NULL || x_close_display == NULL) {
            dlclose(x11_library);
            x11_library = NULL;
            return null_value(env);
        }
    }
    if (display == NULL) display = x_open_display(NULL);
    if (display == NULL) return null_value(env);

    Window root = x_default_root_window(display);
    Window returned_root, returned_child;
    int root_x, root_y, window_x, window_y;
    unsigned int mask;
    if (!x_query_pointer(display, root, &returned_root, &returned_child,
                         &root_x, &root_y, &window_x, &window_y, &mask)) {
        return null_value(env);
    }

    napi_value position, x, y;
    napi_create_object(env, &position);
    napi_create_int32(env, root_x, &x);
    napi_create_int32(env, root_y, &y);
    napi_set_named_property(env, position, "x", x);
    napi_set_named_property(env, position, "y", y);
    return position;
}

static napi_value initialize(napi_env env, napi_value exports) {
    napi_property_descriptor properties[] = {
        {"getPosition", NULL, get_position, NULL, NULL, NULL, napi_default, NULL},
    };
    napi_define_properties(env, exports, sizeof(properties) / sizeof(properties[0]), properties);
    napi_add_env_cleanup_hook(env, close_display, NULL);
    return exports;
}

NAPI_MODULE(remote_mouse_xwayland_pointer, initialize)
