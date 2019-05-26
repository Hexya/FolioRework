import './index.less';

import App from './scripts/init';
import Type from './scripts/type';
import '../node_modules/three/examples/js/loaders/OBJLoader';
import '../node_modules/three/examples/js/loaders/MTLLoader';
import '../node_modules/three/examples/js/loaders/ColladaLoader';

window.app = new App();
//window.app = new Type();
