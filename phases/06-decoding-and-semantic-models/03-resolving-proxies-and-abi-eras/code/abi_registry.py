from dataclasses import dataclass


@dataclass(frozen=True)
class AbiEra:
    chain_id: int
    address: str
    start_block: int
    end_block: int | None
    abi_id: str
    decoder_version: str

    def contains(self, block_number: int) -> bool:
        return self.start_block <= block_number and (
            self.end_block is None or block_number < self.end_block
        )


class Registry:
    def __init__(self, eras: list[AbiEra]) -> None:
        self.eras = eras
        self._validate()

    def _validate(self) -> None:
        grouped: dict[tuple[int, str], list[AbiEra]] = {}
        for era in self.eras:
            grouped.setdefault((era.chain_id, era.address.lower()), []).append(era)
        for key, eras in grouped.items():
            ordered = sorted(eras, key=lambda item: item.start_block)
            for left, right in zip(ordered, ordered[1:]):
                if left.end_block is None or left.end_block > right.start_block:
                    raise ValueError(f"overlapping ABI eras for {key}")

    def resolve(self, chain_id: int, address: str, block_number: int) -> AbiEra:
        matches = [
            era for era in self.eras
            if era.chain_id == chain_id
            and era.address.lower() == address.lower()
            and era.contains(block_number)
        ]
        if len(matches) != 1:
            raise LookupError(f"expected one ABI era, found {len(matches)}")
        return matches[0]


if __name__ == "__main__":
    registry = Registry([
        AbiEra(1, "0x1111", 100, 250, "vault-v1", "decoder-1"),
        AbiEra(1, "0x1111", 250, None, "vault-v2", "decoder-2"),
    ])
    assert registry.resolve(1, "0x1111", 249).abi_id == "vault-v1"
    assert registry.resolve(1, "0x1111", 250).abi_id == "vault-v2"
    print("ABI era checks passed")

