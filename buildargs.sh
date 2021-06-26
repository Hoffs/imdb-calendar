#!/bin/bash
# https://stackoverflow.com/a/43475672/5364746
awk '{ sub ("\\\\$", " "); printf " --build-arg \"%s\"", $0  } END { print ""  }' $@
