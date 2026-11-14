import unittest

from rpc_client import RpcTransportError, parse_batch


class ParseBatchTests(unittest.TestCase):
    def test_matches_out_of_order_items_by_id(self):
        result = parse_batch(
            [
                {"jsonrpc": "2.0", "id": 2, "result": "0x1"},
                {"jsonrpc": "2.0", "id": 1, "result": {"number": "0x10"}},
            ],
            {1, 2},
        )
        self.assertEqual(result.values[1]["number"], "0x10")
        self.assertEqual(result.values[2], "0x1")

    def test_keeps_item_error_from_http_success_payload(self):
        result = parse_batch(
            [
                {"jsonrpc": "2.0", "id": 1, "result": "0x10"},
                {"jsonrpc": "2.0", "id": 2, "error": {"code": -32005, "message": "rate limited"}},
            ],
            {1, 2},
        )
        self.assertEqual(set(result.values), {1})
        self.assertEqual(result.errors[0].request_id, 2)

    def test_rejects_missing_response(self):
        with self.assertRaises(RpcTransportError):
            parse_batch([{"jsonrpc": "2.0", "id": 1, "result": "0x10"}], {1, 2})


if __name__ == "__main__":
    unittest.main()
