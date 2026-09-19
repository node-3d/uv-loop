{
	'variables': {
		'arch': '<!(node -p "process.arch")',
		# Node 26's common.gypi evaluates these when node-gyp cross-targets
		# headers from a different Node version.
		'enable_thin_lto': 'false',
		'lto_jobs': '',
	},
	'targets': [{
		'target_name': 'uv-loop',
		'includes': ['common.gypi', 'node26-msvc.gypi'],
		'defines': ['NODE_ADDON_API_DISABLE_CPP_EXCEPTIONS'],
		'sources': [
			'cpp/bindings.cpp',
			'cpp/loop.cpp',
		],
		'include_dirs': [
			'<!@(node -e "import(\'@node-3d/addon-tools\').then((m) => m.printInclude())")',
		],
	}],
}
