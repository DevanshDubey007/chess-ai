import torch
import torch.nn as nn
import torch.optim as optim
import os

class AlphaZeroTrainer:
    def __init__(self, neural_net, lr=0.01, momentum=0.9, weight_decay=1e-4):
        self.net = neural_net
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.net.to(self.device)
        
        # Optimizer: SGD with momentum as in AlphaZero
        self.optimizer = optim.SGD(
            self.net.parameters(), 
            lr=lr, 
            momentum=momentum, 
            weight_decay=weight_decay
        )
        
        # Loss functions
        self.mse_loss = nn.MSELoss()
        
    def train_step(self, states, policies, values):
        """
        states: numpy array (batch_size, 119, 8, 8)
        policies: numpy array (batch_size, 4672)
        values: numpy array (batch_size,)
        """
        self.net.train()
        
        # Move data to GPU if available and cast appropriately (fp16 could be used here)
        states = torch.FloatTensor(states).to(self.device)
        target_policies = torch.FloatTensor(policies).to(self.device)
        target_values = torch.FloatTensor(values).unsqueeze(1).to(self.device)
        
        # Zero gradients
        self.optimizer.zero_grad()
        
        # Forward pass
        out_policies_logits, out_values = self.net(states)
        
        # Calculate loss
        # Policy Loss: Cross Entropy
        # For numerical stability we apply log_softmax to logits, and then standard cross entropy
        log_probs = nn.functional.log_softmax(out_policies_logits, dim=1)
        policy_loss = -torch.sum(target_policies * log_probs) / target_policies.size(0)
        
        # Value Loss: MSE
        value_loss = self.mse_loss(out_values, target_values)
        
        # Total Loss
        total_loss = policy_loss + value_loss
        
        # Backward pass
        total_loss.backward()
        self.optimizer.step()
        
        return total_loss.item(), policy_loss.item(), value_loss.item()
        
    def save_checkpoint(self, folder="D:/chess-ai/backend/models", filename="checkpoint.pt"):
        if not os.path.exists(folder):
            os.makedirs(folder)
        filepath = os.path.join(folder, filename)
        torch.save({
            'state_dict': self.net.state_dict(),
            'optimizer': self.optimizer.state_dict(),
        }, filepath)
        
    def load_checkpoint(self, filepath="D:/chess-ai/backend/models/checkpoint.pt"):
        if os.path.exists(filepath):
            checkpoint = torch.load(filepath, map_location=self.device)
            self.net.load_state_dict(checkpoint['state_dict'])
            if 'optimizer' in checkpoint:
                self.optimizer.load_state_dict(checkpoint['optimizer'])
            return True
        return False
