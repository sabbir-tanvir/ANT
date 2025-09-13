// Runtime-only config. No fallbacks.
const runtimeEnv = (typeof window !== 'undefined' && window._env_) ? window._env_ : {};
export const Api_Base_Url = runtimeEnv.BASE_URL;
export function refreshRuntimeEnv() {
	const latest = (typeof window !== 'undefined' && window._env_) ? window._env_ : {};
	return {
		Api_Base_Url: latest.BASE_URL,
	};
}
