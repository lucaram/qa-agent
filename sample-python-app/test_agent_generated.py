import math
import pytest

from calculator import add, subtract, divide


@pytest.mark.parametrize(
    "a,b,expected",
    [
        (1, 2, 3),
        (-1, 1, 0),
        (0, 0, 0),
        (2.5, 0.5, 3.0),
        ("foo", "bar", "foobar"),
        ([1, 2], [3], [1, 2, 3]),
    ],
)
def test_add_returns_sum_or_concatenation(a, b, expected):
    assert add(a, b) == expected


@pytest.mark.parametrize(
    "a,b,expected",
    [
        (5, 3, 2),
        (3, 5, -2),  # operand order matters (non-commutative)
        (0, 0, 0),
        (-1, -2, 1),
        (2.5, 0.5, 2.0),
    ],
)
def test_subtract_returns_difference(a, b, expected):
    assert subtract(a, b) == expected


@pytest.mark.parametrize(
    "a,b,expected",
    [
        (10, 2, 5),
        (9, 3, 3),
        (1, 4, 0.25),
        (-9, 3, -3),
        (5.0, 2, 2.5),
    ],
)
def test_divide_returns_quotient(a, b, expected):
    assert divide(a, b) == expected


def test_divide_by_zero_raises_zero_division_error_with_message():
    # Verify both exception type and message as specified by implementation.
    with pytest.raises(ZeroDivisionError, match=r"^division by zero$"):
        divide(1, 0)


def test_divide_preserves_float_semantics_not_floor_division():
    assert divide(1, 2) == 0.5
    assert math.isclose(divide(3, 2), 1.5)


def test_divide_by_negative_number():
    assert divide(10, -2) == -5
    assert divide(-10, -2) == 5