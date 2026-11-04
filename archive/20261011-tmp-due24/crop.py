import pymupdf

doc = pymupdf.open('test-output/comprehensive-report.pdf')
page = doc[56]
rect = pymupdf.Rect(40, 150, 560, 180)
pix = page.get_pixmap(dpi=300, clip=rect)
pix.save('archive/20261011-tmp-due24/img2/crop_p057_header.png')
print(pix.width, pix.height)
