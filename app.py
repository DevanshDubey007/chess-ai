import sys
import os
import importlib.util

# 1. Add backend directory to Python path so internal imports (like `from db...`) work
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

# 2. Load the backend app.py explicitly without triggering circular imports
spec = importlib.util.spec_from_file_location("backend_app", os.path.join(backend_dir, "app.py"))
backend_app = importlib.util.module_from_spec(spec)
sys.modules["backend_app"] = backend_app
spec.loader.exec_module(backend_app)

# 3. Expose the Flask app object so gunicorn can find it
app = backend_app.app
