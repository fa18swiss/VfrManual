
def init():
    import json
    import logging.config
    import os
    import os.path

    root_dir = os.path.join(os.path.dirname(__file__), "..")
    log_config_path = os.path.join(root_dir, "log_config.json")
    log_path = os.path.join(root_dir, "logs")

    os.makedirs(log_path, exist_ok=True)

    with open(log_config_path, "rt") as f:
        log_config = json.load(f)
    logging.config.dictConfig(log_config)
