#include "loop.hpp"


Napi::Object initModule(Napi::Env env, Napi::Object exports) {
	node3d_uv_loop::IdleHandle::Init(env, exports);
	return exports;
}


NODE_API_MODULE(uv_loop, initModule)
