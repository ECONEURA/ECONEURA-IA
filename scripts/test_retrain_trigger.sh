#!/usr/bin/env bash
set -euo pipefail
python3 -c "from ml.training.train import train_model; print(train_model(version='test-0'))"
