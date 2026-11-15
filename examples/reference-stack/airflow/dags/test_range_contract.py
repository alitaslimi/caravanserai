import unittest

from range_contract import plan_ranges, validate_contiguous


class RangeContractTests(unittest.TestCase):
    def test_plans_adjacent_half_open_ranges(self):
        self.assertEqual(
            plan_ranges(100, 107, 3),
            [
                {"from_block": 100, "to_block": 103},
                {"from_block": 103, "to_block": 106},
                {"from_block": 106, "to_block": 107},
            ],
        )

    def test_rejects_gap(self):
        with self.assertRaisesRegex(ValueError, "gap or overlap"):
            validate_contiguous(
                [
                    {"from_block": 100, "to_block": 103},
                    {"from_block": 104, "to_block": 107},
                ],
                100,
                107,
            )

    def test_rejects_incomplete_outer_boundary(self):
        with self.assertRaisesRegex(ValueError, "expected start"):
            validate_contiguous(
                [{"from_block": 101, "to_block": 107}], 100, 107
            )


if __name__ == "__main__":
    unittest.main()

