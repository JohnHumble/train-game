
#/Applications/Blender.app/Contents/MacOS/Blender -b input.blend \
#   --python-expr "import bpy; bpy.ops.export_scene.gltf(filepath='output.glb')"

OUT_FOLDER=exports

mkdir $OUT_FOLDER

for i in *.blend ; do

/Applications/Blender.app/Contents/MacOS/Blender -b $i \
  --python-expr "import bpy; bpy.ops.export_scene.gltf(filepath='$OUT_FOLDER/$i')"

done

