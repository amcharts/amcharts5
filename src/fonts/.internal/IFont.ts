export interface IFile {
	path: string;
	bytes: string;
}

export interface IFont {
	name: string;
	normal: IFile;
	bold?: IFile;
	italics?: IFile;
	bolditalics?: IFile;
}
