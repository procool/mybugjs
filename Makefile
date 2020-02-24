all: compress

compress:
	@yui-compressor js/mybug.js >js/mybug.min.js
#	@uglifyjs js/mybug.js >js/mybug.min.js
