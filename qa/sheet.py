import sys, glob
from PIL import Image
out, cols, w, *pats = sys.argv[1:]
cols, w = int(cols), int(w)
files = [f for p in pats for f in sorted(glob.glob(p))]
ims = [Image.open(f) for f in files]
h = int(ims[0].height * w / ims[0].width)
rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * w, rows * h), 'white')
for i, im in enumerate(ims):
    S.paste(im.resize((w, h)), ((i % cols) * w, (i // cols) * h))
S.save(out)
