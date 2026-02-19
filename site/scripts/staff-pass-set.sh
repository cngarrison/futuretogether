#!/bin/bash

echo -n $(cat .staff-pass) | sha256sum | cut -d ' ' -f1  > .staff-pass-hash