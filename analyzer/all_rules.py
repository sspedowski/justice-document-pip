"""
Import all available rule modules for the analyzer.
Uses try/except for optional rule modules.
"""

from .rules_dates import *
from .rules_presence import *
from .rules_numeric import *

try: 
    from .rules_status import *
except Exception: 
    pass

try: 
    from .rules_location import *
except Exception: 
    pass

try: 
    from .rules_role import *
except Exception: 
    pass

try: 
    from .rules_daterange import *
except Exception: 
    pass