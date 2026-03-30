import {deepMerge} from "../../../utils/shared/objet.utils.js";
import {DEFAULT_CONFIG} from "./defaultConfig.js";
import {getEnvConfig} from "./envConfig.js";

export function getStartupConfigSnapshot() {
    return deepMerge(DEFAULT_CONFIG, getEnvConfig());
}
