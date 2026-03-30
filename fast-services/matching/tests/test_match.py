import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_perfect_match():
    """Voluntarul are exact skill-urile cerute → 100"""
    res = client.post("/match", json={"volunteer_skills": [1, 2, 3], "role_skills": [1, 2, 3]})
    assert res.status_code == 200
    assert res.json()["score"] == 100


def test_no_match():
    """Voluntarul nu are nicio skill cerută → 0"""
    res = client.post("/match", json={"volunteer_skills": [4, 5], "role_skills": [1, 2, 3]})
    assert res.status_code == 200
    assert res.json()["score"] == 0


def test_partial_match():
    """Jaccard: |{1}| / |{1,2,3}| = 1/3 ≈ 33"""
    res = client.post("/match", json={"volunteer_skills": [1], "role_skills": [1, 2, 3]})
    assert res.status_code == 200
    assert res.json()["score"] == 33


def test_role_no_requirements():
    """Rol fără cerințe → oricine se califică → 100"""
    res = client.post("/match", json={"volunteer_skills": [1, 2], "role_skills": []})
    assert res.status_code == 200
    assert res.json()["score"] == 100


def test_both_empty():
    """Ambele goale → 100 (nicio cerință)"""
    res = client.post("/match", json={"volunteer_skills": [], "role_skills": []})
    assert res.status_code == 200
    assert res.json()["score"] == 100


def test_volunteer_no_skills():
    """Voluntarul fără skill-uri, rol cu cerințe → 0"""
    res = client.post("/match", json={"volunteer_skills": [], "role_skills": [1, 2]})
    assert res.status_code == 200
    assert res.json()["score"] == 0
