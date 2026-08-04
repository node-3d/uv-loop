#include "loop.hpp"


Napi::Object initModule(Napi::Env env, Napi::Object exports) {
	node3d_uv_loop::initPump(env);
	exports.Set("setIdleLoop", Napi::Function::New(env, node3d_uv_loop::setIdleLoop));
	return exports;
}


NODE_API_MODULE(uv_loop, initModule)
