{
	'variables': {
		'arch': '<!(node -p "process.arch")',
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
