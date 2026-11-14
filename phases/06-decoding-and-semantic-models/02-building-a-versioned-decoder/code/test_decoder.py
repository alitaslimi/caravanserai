import unittest

from decoder import SYNTHETIC_TOPIC0, decode_value_changed, encode_int256_fixture


ACTOR = "aa" * 20
ACTOR_TOPIC = "0x" + "00" * 12 + ACTOR
RECORD_ID = "22" * 32


class DecoderTests(unittest.TestCase):
    def decode(self, delta: int):
        data = "0x" + encode_int256_fixture(delta) + RECORD_ID
        return decode_value_changed([SYNTHETIC_TOPIC0, ACTOR_TOPIC], data)

    def test_decodes_positive_delta(self):
        event = self.decode(25)
        self.assertEqual(event.actor_address, "0x" + ACTOR)
        self.assertEqual(event.delta_raw, 25)
        self.assertEqual(event.record_id, "0x" + RECORD_ID)

    def test_decodes_twos_complement_negative_delta(self):
        self.assertEqual(self.decode(-7).delta_raw, -7)

    def test_rejects_wrong_data_length(self):
        with self.assertRaises(ValueError):
            decode_value_changed([SYNTHETIC_TOPIC0, ACTOR_TOPIC], "0x" + "00" * 32)


if __name__ == "__main__":
    unittest.main()
