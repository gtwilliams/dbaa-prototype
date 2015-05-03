#!/bin/sh

SERVER_ROOT=${HOME}/myapp
FILES="app.js config.json"
DIRS="bin public routes views"
LESSCSS=lessc
STYLESHEETS=public/stylesheets

[ -d $SERVER_ROOT ] || mkdir -p $SERVER_ROOT

for f in $FILES; do
    echo "cp $f $SERVER_ROOT"
    cp $f $SERVER_ROOT
done

# generate style sheets
for s in $STYLESHEETS/*.less; do
    $LESSCSS $s > ${s%%.*}.css
done

for d in $DIRS; do
    [ -d $SERVER_ROOT/$d ] || mkdir -p $SERVER_ROOT/$d
    echo "cp -r $d/* $SERVER_ROOT/$d"
    cp -r $d/* $SERVER_ROOT/$d
done
