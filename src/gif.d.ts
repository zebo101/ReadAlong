// esbuild's "dataurl" loader turns a .gif import into a base64 data-URI string.
declare module "*.gif" {
	const src: string;
	export default src;
}
