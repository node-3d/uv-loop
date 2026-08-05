import { getLogger, install } from '@node-3d/addon-tools';

const prefix = 'https://github.com/node-3d/uv-loop/releases/download';
const logger = getLogger('uv-loop');
const version = '0.1.0';
const NODE_VERSION_MIN = 20;
const NODE_VERSION_MAX = 26;

const runtimeNodeMajor = Number.parseInt(process.versions.node.split('.')[0] || '', 10);

const getBinaryNodeMajor = (nodeMajor) => {
	if (!Number.isSafeInteger(nodeMajor)) {
		return NODE_VERSION_MAX;
	}

	if (nodeMajor < NODE_VERSION_MIN) {
		return NODE_VERSION_MIN;
	}

	if (nodeMajor > NODE_VERSION_MAX) {
		return NODE_VERSION_MAX;
	}

	if (nodeMajor % 2 === 1) {
		return nodeMajor - 1;
	}

	return nodeMajor;
};

const binaryNodeMajor = getBinaryNodeMajor(runtimeNodeMajor);

if (binaryNodeMajor !== runtimeNodeMajor) {
	logger.warn(
		`[uv-loop] Node.js ${process.versions.node} does not have a dedicated binary; using Node.js ${binaryNodeMajor} binary.`,
	);
}

await install(`${prefix}/${version}-${binaryNodeMajor}`);
