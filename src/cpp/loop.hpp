#pragma once

#include <napi.h>
#include <uv.h>


namespace node3d_uv_loop {

class IdleHandle : public Napi::ObjectWrap<IdleHandle> {
  public:
	static Napi::Object Init(Napi::Env env, Napi::Object exports);
	explicit IdleHandle(const Napi::CallbackInfo &info);
	~IdleHandle() override;

  private:
	static Napi::FunctionReference constructor;
	static void Cleanup(void *data);
	static void OnIdle(uv_idle_t *handle);
	static void OnClose(uv_handle_t *handle);
	static Napi::Value SetIdle(const Napi::CallbackInfo &info);
	static Napi::Value SetIdleLoop(const Napi::CallbackInfo &info);
	static Napi::Value ClearIdle(const Napi::CallbackInfo &info);
	static Napi::Value RefIdle(const Napi::CallbackInfo &info);
	static Napi::Value UnrefIdle(const Napi::CallbackInfo &info);
	static IdleHandle *GetHandle(Napi::Env env, const Napi::Value &value, bool allowNull);
	static Napi::Object Create(Napi::Env env, const Napi::Function &callback, bool once);

	void Start();
	void RefHandle();
	void UnrefHandle();
	void Tick();
	void Close();

	Napi::FunctionReference _callback;
	napi_env _env = nullptr;
	uv_loop_t *_uvLoop = nullptr;
	uv_idle_t _idle = {};
	bool _once = false;
	bool _running = false;
	bool _closing = false;
	bool _refed = true;
	bool _hasCleanupHook = false;
};

} // namespace node3d_uv_loop
