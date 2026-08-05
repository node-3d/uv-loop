{
	'conditions': [
		['OS=="win"', {
			'ldflags!': [
				'/flto=thin',
				'/opt:lldltojobs=2',
				'opt:lldltojobs=2',
			],
			'msvs_settings': {
				'VCCLCompilerTool': {
					'AdditionalOptions!' : ['/flto=thin'],
				},
				'VCLinkerTool': {
					'AdditionalOptions!' : [
						'/flto=thin',
						'/opt:lldltojobs=2',
						'opt:lldltojobs=2',
					],
				},
			},
		}],
	],
}
