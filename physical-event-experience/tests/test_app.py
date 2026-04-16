import pytest
from app import app, simulation_state, advance_simulation
import json

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
    with app.test_client() as client:
        yield client

def test_advance_simulation():
    """Test that the simulation drift works within bounds."""
    initial_occupancy = simulation_state["occupancy"]
    advance_simulation()
    new_occupancy = simulation_state["occupancy"]
    
    # Check occupancy is within logical bounds
    assert new_occupancy <= simulation_state["capacity"]
    assert new_occupancy >= 5000
    
    # Check gate wait times are within bounds
    for gate in simulation_state["gates"]:
        assert 1 <= gate["waitTimeMinutes"] <= 45

def test_api_status(client):
    """Test the /api/status endpoint."""
    response = client.get('/api/status')
    assert response.status_code == 200
    data = response.get_json()
    assert 'occupancy' in data
    assert 'gates' in data
    assert 'zones' in data

def test_api_assistant_chat_no_data(client):
    """Test assistant chat with empty query."""
    response = client.post('/api/assistant/chat', 
                           data=json.dumps({}),
                           content_type='application/json')
    assert response.status_code == 400
    data = response.get_json()
    assert data['message'] == "Empty query"

def test_api_admin_broadcast(client):
    """Test admin broadcast endpoint."""
    test_msg = "Test Broadcast Message"
    response = client.post('/api/admin/broadcast',
                           data=json.dumps({"message": test_msg, "type": "info"}),
                           content_type='application/json')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == "success"
    assert data['alert']['message'] == test_msg
    
    # Verify alert is in state
    assert any(a['message'] == test_msg for a in simulation_state['alerts'])

def test_home_page(client):
    """Test home page routing."""
    response = client.get('/')
    assert response.status_code == 200
    assert b"StadiumIQ" in response.data
