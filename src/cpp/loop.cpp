#include "loop.hpp"


namespace node3d_uv_loop {

Napi::FunctionReference IdleHandle::constructor;


Napi::Object IdleHandle::Init(Napi::Env env, Napi::Object exports) {
	Napi::Function ctor = DefineClass(env, "IdleHandle", {});

	constructor = Napi::Persistent(ctor);
	constructor.SuppressDestruct();

	exports.Set("setIdle", Napi::Function::New(env, SetIdle));
	exports.Set("setIdleLoop", Napi::Function::New(env, SetIdleLoop));
	exports.Set("clearIdle", Napi::Function::New(env, ClearIdle));
	exports.Set("refIdle", Napi::Function::New(env, RefIdle));
	exports.Set("unrefIdle", Napi::Function::New(env, UnrefIdle));

	return exports;
}


IdleHandle::IdleHandle(const Napi::CallbackInfo &info) : Napi::ObjectWrap<IdleHandle>(info) {
	Napi::Env env = info.Env();

	if (info.Length() < 2 || !info[0].IsFunction() || !info[1].IsBoolean()) {
		Napi::TypeError::New(env, "IdleHandle constructor expects callback and once flag")
		    .ThrowAsJavaScriptException();
		return;
	}

	_callback = Napi::Persistent(info[0].As<Napi::Function>());
	_once = info[1].As<Napi::Boolean>().Value();
	_env = env;

	if (napi_add_env_cleanup_hook(_env, Cleanup, this) == napi_ok) {
		_hasCleanupHook = true;
	}
}


IdleHandle::~IdleHandle() {
	Close();
}


Napi::Value IdleHandle::SetIdle(const Napi::CallbackInfo &info) {
	Napi::Env env = info.Env();

	if (info.Length() < 1 || !info[0].IsFunction()) {
		Napi::TypeError::New(env, "setIdle expects a callback").ThrowAsJavaScriptException();
		return env.Undefined();
	}

	return Create(env, info[0].As<Napi::Function>(), true);
}


Napi::Value IdleHandle::SetIdleLoop(const Napi::CallbackInfo &info) {
	Napi::Env env = info.Env();

	if (info.Length() < 1 || !info[0].IsFunction()) {
		Napi::TypeError::New(env, "setIdleLoop expects a callback").ThrowAsJavaScriptException();
		return env.Undefined();
	}

	return Create(env, info[0].As<Napi::Function>(), false);
}


Napi::Value IdleHandle::ClearIdle(const Napi::CallbackInfo &info) {
	Napi::Env env = info.Env();
	IdleHandle *handle = GetHandle(env, info.Length() > 0 ? info[0] : env.Undefined(), true);

	if (handle != nullptr) {
		handle->Close();
	}

	return env.Undefined();
}


Napi::Value IdleHandle::RefIdle(const Napi::CallbackInfo &info) {
	Napi::Env env = info.Env();
	IdleHandle *handle = GetHandle(env, info.Length() > 0 ? info[0] : env.Undefined(), false);

	if (handle != nullptr) {
		handle->RefHandle();
	}

	return env.Undefined();
}


Napi::Value IdleHandle::UnrefIdle(const Napi::CallbackInfo &info) {
	Napi::Env env = info.Env();
	IdleHandle *handle = GetHandle(env, info.Length() > 0 ? info[0] : env.Undefined(), false);

	if (handle != nullptr) {
		handle->UnrefHandle();
	}

	return env.Undefined();
}


IdleHandle *IdleHandle::GetHandle(Napi::Env env, const Napi::Value &value, bool allowNull) {
	if (allowNull && (value.IsNull() || value.IsUndefined())) {
		return nullptr;
	}

	if (!value.IsObject() || !value.As<Napi::Object>().InstanceOf(constructor.Value())) {
		Napi::TypeError::New(env, "Expected an idle handle").ThrowAsJavaScriptException();
		return nullptr;
	}

	return IdleHandle::Unwrap(value.As<Napi::Object>());
}


Napi::Object IdleHandle::Create(Napi::Env env, const Napi::Function &callback, bool once) {
	Napi::Object object = constructor.New({ callback, Napi::Boolean::New(env, once) });
	IdleHandle *handle = IdleHandle::Unwrap(object);
	handle->Start();
	return object;
}


void IdleHandle::Cleanup(void *data) {
	auto *self = static_cast<IdleHandle *>(data);
	self->_hasCleanupHook = false;
	self->Close();
	self->_env = nullptr;
}


void IdleHandle::OnIdle(uv_idle_t *handle) {
	static_cast<IdleHandle *>(handle->data)->Tick();
}


void IdleHandle::OnClose(uv_handle_t *handle) {
	auto *self = static_cast<IdleHandle *>(handle->data);
	self->_closing = false;
	self->_uvLoop = nullptr;
	self->Unref();
}


void IdleHandle::Start() {
	if (_running || _closing || _env == nullptr) {
		return;
	}

	uv_loop_t *loop = nullptr;
	napi_status status = napi_get_uv_event_loop(_env, &loop);
	if (status != napi_ok || loop == nullptr) {
		Napi::Error::New(Napi::Env(_env), "Failed to get the current libuv event loop")
		    .ThrowAsJavaScriptException();
		return;
	}

	_uvLoop = loop;
	_idle.data = this;

	int initStatus = uv_idle_init(_uvLoop, &_idle);
	if (initStatus == 0) {
		initStatus = uv_idle_start(&_idle, OnIdle);
	}

	if (initStatus != 0) {
		Napi::Error::New(Napi::Env(_env), uv_strerror(initStatus)).ThrowAsJavaScriptException();
		return;
	}

	_running = true;
	_refed = true;
	Ref();
}


void IdleHandle::RefHandle() {
	if (_running) {
		uv_ref(reinterpret_cast<uv_handle_t *>(&_idle));
		_refed = true;
	}
}


void IdleHandle::UnrefHandle() {
	if (_running) {
		uv_unref(reinterpret_cast<uv_handle_t *>(&_idle));
		_refed = false;
	}
}


void IdleHandle::Tick() {
	if (!_running || _env == nullptr) {
		return;
	}

	if (_once) {
		Close();
	}

	Napi::Env env(_env);
	Napi::HandleScope scope(env);
	_callback.Call({});

	if (env.IsExceptionPending()) {
		Close();
	}
}


void IdleHandle::Close() {
	if (!_running || _closing) {
		return;
	}

	_running = false;
	_closing = true;

	uv_idle_stop(&_idle);
	uv_close(reinterpret_cast<uv_handle_t *>(&_idle), OnClose);

	if (_hasCleanupHook && _env != nullptr) {
		napi_remove_env_cleanup_hook(_env, Cleanup, this);
		_hasCleanupHook = false;
	}
}

} // namespace node3d_uv_loop
