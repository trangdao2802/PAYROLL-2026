with open("src/app/pages/04-balance/BulkPayment.tsx", "r") as f:
    content = f.read()

bad_str = """                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>"""

good_str = """                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>"""

if bad_str in content:
    content = content.replace(bad_str, good_str)
    with open("src/app/pages/04-balance/BulkPayment.tsx", "w") as f:
        f.write(content)
    print("Fixed missing AnimatePresence")
else:
    print("Not found")
