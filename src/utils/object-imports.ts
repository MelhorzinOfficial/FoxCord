export function getObjectImports<T>(allExports: any): T[] {
	return Object.values(allExports).map((exp) => exp as T);
}
