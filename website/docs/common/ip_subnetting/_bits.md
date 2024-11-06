### Working with Bits

IP addresses are represented in groups of 8 bits. Therefore, you need good binary skills.

When converting a number to binary, it's best to break it down into powers of 2. For example:
* `17 = 16 + 1 = 2^4 + 2^0`; results in the representation (in 8-bit binary) `00010001`
* `173 = 128 + 32 + 8 + 4 + 1 = 2^7 + 2^5 + 2^3 + 2^2 + 2^0`; results in the representation (in 8-bit binary) `10101101`

The ability to quickly represent numbers around powers of 2 is useful. For example for `64 = 01000000`:
- 63 is 64-1, a number with many bits set to 1 (6 bits): `00111111`
- 62 is 63-1, a number with one less 1 (5 bits of 1 and one bit of 0): `00111110`
- 65 is 64+1, adding the last bit of 1 to the representation of 64: `01000001`

:::note Convert the following numbers to 8-bit binary:
127, 80, 72, 254.
:::
