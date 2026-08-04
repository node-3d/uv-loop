#include "loop.hpp"


namespace node3d_uv_loop {

namespace {

napi_env pumpEnv = nullptr;
uv_idle_t pump = {};
Napi::FunctionReference callback;


void onIdle(uv_idle_t *) {
	if (pumpEnv == nullptr || callback.IsEmpty()) {
		return;
	}

	Napi::Env env(pumpEnv);
	Napi::HandleScope scope(env);
	callback.Call({});
}


Napi::Value refPump(const Napi::CallbackInfo &info) {
	uv_ref(reinterpret_cast<uv_handle_t *>(&pump));
	return info.Env().Undefined();
}


Napi::Value unrefPump(const Napi::CallbackInfo &info) {
	uv_unref(reinterpret_cast<uv_handle_t *>(&pump));
	return info.Env().Undefined();
}

} // namespace


void initPump(Napi::Env env) {
	uv_loop_t *loop = nullptr;
	napi_status status = napi_get_uv_event_loop(env, &loop);
	if (status != napi_ok || loop == nullptr) {
		Napi::Error::New(env, "Failed to get the current libuv event loop").ThrowAsJavaScriptException();
		return;
	}

	int initStatus = uv_idle_init(loop, &pump);
	if (initStatus == 0) {
		initStatus = uv_idle_start(&pump, onIdle);
	}

	if (initStatus != 0) {
		Napi::Error::New(env, uv_strerror(initStatus)).ThrowAsJavaScriptException();
		return;
	}

	pumpEnv = env;
	uv_unref(reinterpret_cast<uv_handle_t *>(&pump));
}


Napi::Value setIdleLoop(const Napi::CallbackInfo &info) {
	Napi::Env env = info.Env();

	if (info.Length() < 1 || (!info[0].IsFunction() && !info[0].IsNull())) {
		Napi::TypeError::New(env, "setIdleLoop expects a callback or null").ThrowAsJavaScriptException();
		return env.Undefined();
	}

	callback.Reset();
	if (info[0].IsFunction()) {
		callback = Napi::Persistent(info[0].As<Napi::Function>());
		callback.SuppressDestruct();
	}

	Napi::Object control = Napi::Object::New(env);
	control.Set("ref", Napi::Function::New(env, refPump));
	control.Set("unref", Napi::Function::New(env, unrefPump));
	return control;
}

} // namespace node3d_uv_loop
