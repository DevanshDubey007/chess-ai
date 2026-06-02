import random
from collections import deque
import numpy as np

class ReplayBuffer:
    def __init__(self, capacity=500000):
        self.capacity = capacity
        # We use a deque which automatically drops oldest elements when maxlen is reached
        self.buffer = deque(maxlen=capacity)
        
    def save_game(self, game_history):
        """
        game_history is a list of tuples: (state_tensor, policy_target, value_target)
        where:
        - state_tensor: 119x8x8 numpy array
        - policy_target: 4672-dim numpy array
        - value_target: float scalar (-1, 0, 1)
        """
        for transition in game_history:
            self.buffer.append(transition)
            
    def sample_batch(self, batch_size=4096):
        """Returns a random mini-batch of (state, policy, value)"""
        batch_size = min(batch_size, len(self.buffer))
        batch = random.sample(self.buffer, batch_size)
        
        states = np.array([x[0] for x in batch], dtype=np.float32)
        policies = np.array([x[1] for x in batch], dtype=np.float32)
        values = np.array([x[2] for x in batch], dtype=np.float32)
        
        return states, policies, values
        
    def __len__(self):
        return len(self.buffer)
