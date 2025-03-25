#include <iostream>
#include <string>
#include <algorithm>

using namespace std;

string reverseString(const string& str) {
    string reversed = str;
    reverse(reversed.begin(), reversed.end());
    return reversed;
}

string isPalindrome;
int main() {
    string alfabeto;
    string longitud;
    string input;
    cout << "Ingresa un alfabeto: ";
    cin >> alfabeto;

    cout << "Ingresa el límite de longitud de los palíndromos: ";
    cin >> longitud;

    string reversedAlfabeto = reverseString(alfabeto);
    cout << "Alfabeto invertido: " << reversedAlfabeto << endl;

    return 0;
}