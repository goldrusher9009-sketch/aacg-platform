# Contributing to Nova

Thanks for your interest in Nova! There are two ways to contribute:

## 1. Donate GPU Cycles (Easiest)

Run the worker script and your GPU helps train the model:

```bash
pip install torch numpy websockets
git clone https://github.com/YOUR_USERNAME/nova.git
cd nova
python -m nova.swarm.worker --coordinator wss://nova-coordinator.example.com
```

Leave it running as long as you want. You can stop anytime.

## 2. Contribute Code

1. Fork the repo
2. Create a branch: `git checkout -b my-feature`
3. Make your changes
4. Run the tests: `python scripts/simulate_swarm.py`
5. Submit a pull request

### Areas We Need Help

- **Performance**: Optimize the training loop, CUDA kernels, memory usage
- **Networking**: Improve the WebSocket protocol, add reconnection logic
- **Data**: Build data collection and cleaning pipelines
- **Testing**: Add unit tests and integration tests
- **Documentation**: Improve guides, tutorials, and API docs
- **Frontend**: Build a monitoring dashboard for the coordinator

### Code Style

- Use type hints
- Add docstrings to functions and classes
- Keep functions focused and under 50 lines when possible

## Questions?

Open an issue on GitHub or join the Discord.
