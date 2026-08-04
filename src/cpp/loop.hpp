#pragma once

#include <napi.h>
#include <uv.h>


namespace node3d_uv_loop {

void initPump(Napi::Env env);
Napi::Value setIdleLoop(const Napi::CallbackInfo &info);

} // namespace node3d_uv_loop
