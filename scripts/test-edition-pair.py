"""Prevent one completed style from publishing a mismatched daily issue."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('daily_mirror', Path(__file__).with_name('mirror-daily.py'))
mirror = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mirror)

def edition(style, date):
    return {'style': style, 'date': date}

class DailyPairTest(unittest.TestCase):
    def test_same_date_can_publish(self):
        self.assertEqual(mirror.validate_latest_pair([edition('blue-white', '2026-10-16'), edition('dark', '2026-10-16')]), '2026-10-16')

    def test_dark_ahead_is_blocked(self):
        with self.assertRaises(ValueError):
            mirror.validate_latest_pair([edition('blue-white', '2026-10-15'), edition('dark', '2026-10-16')])

    def test_blue_ahead_is_blocked(self):
        with self.assertRaises(ValueError):
            mirror.validate_latest_pair([edition('blue-white', '2026-10-16'), edition('dark', '2026-10-15')])

    def test_missing_style_is_blocked(self):
        with self.assertRaises(ValueError):
            mirror.validate_latest_pair([edition('dark', '2026-10-16')])

    def test_historic_single_style_records_do_not_block_latest_pair(self):
        records = [edition('blue-white', '2026-10-16'), edition('dark', '2026-10-16'), edition('dark', '2026-09-01')]
        self.assertEqual(mirror.validate_latest_pair(records), '2026-10-16')

if __name__ == '__main__':
    unittest.main()
