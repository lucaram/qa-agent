import pytest
from calculator import add, subtract, divide

def test_add():
    assert add(100, 10) == 110

def test_subtract():
    assert subtract(100, 10) == 90

def test_divide():
    assert divide(100, 10) == 10

def test_divide_by_zero():
    with pytest.raises(ZeroDivisionError, match="division by zero"):
        divide(100, 0)
