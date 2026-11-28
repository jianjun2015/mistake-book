import os
import pathlib
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

# Isolate test data before backend.database computes its paths
os.environ["VIDEO_GENERATOR_DATA_DIR"] = tempfile.mkdtemp(prefix="vg-test-")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from backend.database import init_db  # noqa: E402
from backend.main import app  # noqa: E402


@pytest.fixture()
def client():
    init_db()
    with TestClient(app) as c:
        yield c
