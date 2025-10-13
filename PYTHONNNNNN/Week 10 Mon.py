# for i in range(5):
#     print(i)
#  # this prints 0-4

# for number in range (6):
#       print(number)
# #using the word number instead of i makes things easier to understand

# for welcome_to_python in range(10):
#     print("Welcome to Python")
# # # this prints "Welcome to Python" 10 times

# for number in range (21):
#       print(f"The Number Is: {number}")

# Num = int(input("How mant times do you want to print 'Congrats - You have almost finished CITE404!'?: "))
# for i in range(Num):
#     print("Congrats - You have almost finished CITE404!")

# multiplier = int(input("What multiplier should I use? "))
# for number in range (5,11):
#         result = number * multiplier
#         print (f" The number {number} multiplied x {multiplier} is {result}")

# for i in range(1, 10, 2):
#     print(i)
# # this prints odd numbers from 1 to 9

# for i in range(10, 0, -1):
#     print(i)
# # this prints numbers from 10 to 1

# for number in range(5, 101, 5):
#     print(number)
# # this prints multiples of 5 from 5 to 100

# for number in range(5,21, 3):
#     print(number)
# # this prints numbers from 5 to 20 counting by 3s

# step_value = int(input("Enter a step value: "))
# for number in range (0,50, step_value):
#     print (number)

# step_value = int(input("Enter a step value: "))
# for number in range (0,50, step_value):
#     print (number)
          
# start = int(input("Enter start: "))
# stop = int(input("Enter stop: "))
# step = int(input("Enter step: "))
# for number in range(start, stop + 1, step):
#     print (number)

# num = int(input("Enter a number to count down from: "))
# for value in range(num, -1, -1):
#     print(value)

# word = input("Enter a word: ")
# for letter in word:
#     print(len(letter))

FuelUnits=int(input("How many fuel units are needed? "))
for i in range(FuelUnits):
    print(f"Fuel Loaded: [{'#' * (i + 1)}] {i + 1}/{FuelUnits}")