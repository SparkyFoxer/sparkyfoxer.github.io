# BrendanC
# Oreos question
IsPrime = True
Divisor = None

Num = input("give me a number: ")
if Num.isdigit() == False:
    print("That's not a number!")
elif Num == "1":
    print("One isn't prime, as it has one factor, itself.")
elif Num == "2":
    print("Two is prime, as it has two factors, 1 and itself.")

else:
    Num = int(Num)
    if Num % 2 == 0:
        IsPrime = False
        Divisor = 2
    elif Num % 3 == 0:
        IsPrime = False
        Divisor = 3
    elif Num % 5 == 0:
        IsPrime = False
        Divisor = 5
    elif Num % 7 == 0:
        IsPrime = False
        Divisor = 7
    else:
        IsPrime = True

    if IsPrime:
        print(f"{Num} is prime.")
    else:
        if Divisor:
            print(f"{Num} is not prime, as it is divisible by {Divisor}.")
        else:
            print(f"{Num} is not prime.")