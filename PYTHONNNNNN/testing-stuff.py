
HelloChatGpt = "Foxes are clever, foxes are quick! A fox is clever indeed.".replace(",", "").replace("!", "").replace(".", "").lower().split()
max_count = 0
max_word = None
print(HelloChatGpt)
print(len(HelloChatGpt))
print(HelloChatGpt[0])
counts = dict()
for word in HelloChatGpt:
    counts[word] = counts.get(word, 0) + 1
    # if word in counts:
    #     counts[word] += 1
    # else:
    #     counts[word] = 1

for k, v in counts.items():
    print(f"{k}: {v}")

for word, count in counts.items():
    if count > max_count:
        max_count = count
        max_word = word

print(f"The most common word is '{max_word}' ({max_count} times)")
