function healthCheck() {
  return {
    ok: true,
    project: 'Story Helper',
    timestamp: new Date().toISOString()
  };
}
