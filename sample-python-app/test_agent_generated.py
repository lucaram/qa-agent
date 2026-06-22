import pytest

from calculator import add, subtract, divide

def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0
    assert add(-2, -3) == -5

def test_subtract():
    assert subtract(5, 3) == 2
    assert subtract(2, 5) == -3
    assert subtract(-1, -1) == 0

def test_subtract_non_commutative():
    assert subtract(5, 3) == 2
    assert subtract(3, 5) == -2

def test_divide():
    assert divide(6, 2) == 3
    assert divide(5, 2) == 2.5
    assert divide(-6, 2) == -3
    
def test_divide_by_zero():
    with pytest.raises(ZeroDivisionError):
        divide(1, 0)
        
def test_divide_non_zero_divisor():
    assert divide(4, 2) == 2
    assert divide(-8, -2) == 4