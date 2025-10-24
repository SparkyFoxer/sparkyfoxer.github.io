#  Num = int(input("Please give me a number: "))
# for number in range(1, 10):
#     if number == 3:
#         print("This is the correct number")
#     else:
#         print("Wrong number - Try again")

#Number is even or odd
# Num = 
# if Num % 2 == 0:
#     print("The number is even.")
# else:
#     print("The number is odd.")

# Num = int(input("Please give me a number: "))
# for number in range(1, 51):
#     if number % 3 == 0 and number % 7 == 0:
#         print(f"The number: {number} is divisible by both 3 and 7.")

# Start = int(input("Enter the start of the range: "))
# Stop = int(input("Enter the stop of the range: "))
# Devisor = int(input("Enter the divisor: "))

# for number in range(Start, Stop + 1):
#     if number % Devisor == 0:
#         print(f"The number: {number} is divisible by {Devisor}.")

# reason for +1 is because the range function is exclusive of the stop value


# counter = 1
# while counter < 10:
#     print(counter)
#     counter += 1

# counter = 10
# while counter > 0:
#     print(counter)
#     counter -= 1

total = 0
counter = 1

while counter <= 20:
    counter += 1   
    total = total + counter
    print(total)

